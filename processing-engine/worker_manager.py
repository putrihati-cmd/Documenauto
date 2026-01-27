import os
import time
import redis
import json
import traceback
from utils.sandbox import run_in_sandbox
from utils.pdf_compressor import compress_pdf
# Grammar checker loaded lazily to save RAM if needed, or precached
# from utils.grammar_checker import IndoGrammarAgent

REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
QUEUE_NAME = 'smartcopy_jobs'

def handle_job(job):
    """
    Dispatcher utama: Membedah job dan memanggil tool yang sesuai.
    Job Format: { "type": "format", "input": "...", "ref": "...", "output": "..." }
    """
    job_type = job.get('type')
    print(f">> [Worker] Received Job: {job_type}")
    
    try:
        # 1. JOB: FORMAT DOKUMEN (Style Applicator)
        if job_type == 'format':
            input_path = job.get('input')
            ref_path = job.get('ref') # Bisa path file atau kategori
            output_path = job.get('output')
            
            # Jalan di dalam Sandbox agar aman
            print(f"   Executing Style Applicator in Sandbox...")
            result = run_in_sandbox(
                '/app/style_applicator.py', 
                [input_path, ref_path, output_path],
                timeout=60
            )
            
            if result['success']:
                print("   ✅ Format Success!")
                return {"status": "success", "file": output_path}
            else:
                print(f"   ❌ Format Failed: {result.get('error') or result.get('stderr')}")
                return {"status": "failed", "error": result.get('error')}

        # 2. JOB: SCAN TEMPLATE
        elif job_type == 'scan_template':
            input_path = job.get('input')
            category = job.get('category', 'default')
            
            print(f"   Scanning Template ({category})...")
            result = run_in_sandbox(
                '/app/template_scanner.py',
                [input_path, category],
                timeout=30
            )
             
            if result['success']:
                print("   ✅ Scan Success!")
                return {"status": "success", "category": category}
            else:
                return {"status": "failed", "error": result.get('stderr')}

        # 3. JOB: COMPRESS PDF
        elif job_type == 'compress_pdf':
            input_path = job.get('input')
            output_path = job.get('output')
            
            print("   Compressing PDF...")
            res = compress_pdf(input_path, output_path)
            if res['success']:
                print(f"   ✅ Compressed: {res['saved_percent']} saved")
                return res
            else:
                return {"status": "failed", "error": res['error']}

        else:
            return {"status": "failed", "error": "Unknown Job Type"}

    except Exception as e:
        print(f"   ❌ Critical Worker Error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def main():
    print("🚀 SmartCopy Python Engine Started (Optimized Mode)")
    print(f"   Listening on Queue: {QUEUE_NAME}")
    
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
        
        while True:
            # Blocking Pop: Tunggu sampai ada job (Hemat CPU)
            # Format: (queue_name, data)
            item = r.blpop(QUEUE_NAME, timeout=5)
            
            if item:
                queue, data_str = item
                try:
                    job_data = json.loads(data_str)
                    result = handle_job(job_data)
                    
                    # TODO: Publish result back to Redis Key for Backend to pick up
                    # r.set(f"job_result:{job_data.get('id')}", json.dumps(result), ex=3600)
                    
                except json.JSONDecodeError:
                    print("   Error: Invalid JSON Job Data")
            
            # Idle beat
            # time.sleep(0.1) # Tidak perlu karena blpop sudah blocking

    except Exception as e:
        print(f"🔥 Redis Connection Error: {e}")
        time.sleep(5) # Auto-reconnect delay
        main()

if __name__ == "__main__":
    main()
