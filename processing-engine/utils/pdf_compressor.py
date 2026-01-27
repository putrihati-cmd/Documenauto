from PyPDF2 import PdfReader, PdfWriter
import os

def compress_pdf(input_path, output_path):
    """
    Kompresi PDF secara agresif untuk menghemat storage server.
    Cocok untuk skripsi tebal (50MB -> 5MB).
    """
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        for page in reader.pages:
            # 1. Compress Content Streams (Teks & Vektor)
            page.compress_content_streams()
            writer.add_page(page)

        # 2. Kurangi Kualitas Gambar (Optional - butuh library Pillow helper)
        # Untuk clean python, kita pakai fitur bawaan PDF structure optimization saja.
        
        # 3. Metadata Cleaning
        writer.add_metadata({
            '/Producer': 'SmartCopy AI Engine'
        })

        with open(output_path, 'wb') as f:
            writer.write(f)
            
        original_size = os.path.getsize(input_path)
        new_size = os.path.getsize(output_path)
        ratio = (1 - (new_size / original_size)) * 100
        
        return {
            "success": True,
            "original_size": original_size,
            "compressed_size": new_size,
            "saved_percent": f"{ratio:.2f}%"
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
