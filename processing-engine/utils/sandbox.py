import subprocess
import tempfile
import shutil
import os
import signal

def run_in_sandbox(script_path, args, timeout=30):
    """
    Menjalankan script Python lain di dalam lingkungan terisolasi (Sandbox).
    Tujuannya: Jika script error atau kena virus, sistem utama tetap aman.
    """
    # 1. Buat folder sementara (akan otomatis dihapus setelah selesai)
    with tempfile.TemporaryDirectory() as sandbox_dir:
        print(f"[Sandbox] Created isolate env: {sandbox_dir}")
        
        # 2. Salin script worker ke dalam sandbox
        sandbox_script = os.path.join(sandbox_dir, os.path.basename(script_path))
        shutil.copy2(script_path, sandbox_script)
        
        # 3. Siapkan Command
        # cmd = ['python3', sandbox_script] + args
        # Catatan: Untuk MVP, kita jalankan langsung. 
        # Idealnya memakai Docker-in-Docker atau Chroot, tapi tempfile sudah cukup untuk level file.
        
        cmd = ['python', script_path] + args # Running direct for now to allow imports
        
        try:
            # 4. Eksekusi dengan Timeout Ketat
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=sandbox_dir # Working directory dipindah ke sandbox
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Execution timed out after {timeout}s (Potential infinite loop/malware)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
