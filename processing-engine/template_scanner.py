from docx import Document
import json
import sys

def scan_template(file_path):
    """
    Menganalisa file 'Master' dan mengambil aturannya:
    1. Margin (Top, Bottom, Left, Right)
    2. Font Utama (Name, Size)
    3. Paragraph Spacing (Line Spacing)
    """
    try:
        doc = Document(file_path)
        rules = {}
        
        # 1. Ambil Margin dari Section Pertama
        # asumsi: format skripsi konsisten dari awal
        section = doc.sections[0]
        rules['margin'] = {
            'top_cm': round(section.top_margin.cm, 2),
            'bottom_cm': round(section.bottom_margin.cm, 2),
            'left_cm': round(section.left_margin.cm, 2),
            'right_cm': round(section.right_margin.cm, 2)
        }
        
        # 2. Deteksi Font Dominan
        # Kita scan 5 paragraf awal untuk cari font yang paling banyak muncul
        fonts_found = {}
        for i, paragraph in enumerate(doc.paragraphs[:10]):
            for run in paragraph.runs:
                font_name = run.font.name
                if font_name:
                    fonts_found[font_name] = fonts_found.get(font_name, 0) + 1
        
        # Ambil yang terbanyak, default Times New Roman kalau tidak ketemu
        if fonts_found:
            dominant_font = max(fonts_found, key=fonts_found.get)
        else:
            dominant_font = 'Times New Roman (Default)'
            
        rules['font'] = {
            'name': dominant_font
        }
        
        return rules

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Test Mode
    target_file = 'master_template.docx'
    category = 'default'
    
    # Cek argument: python template_scanner.py <file> <category>
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    if len(sys.argv) > 2:
        category = sys.argv[2]

    print(f"Scanning Template: {target_file} (Category: {category})...")
    
    try:
        rules = scan_template(target_file)
        
        # Tambahkan metadata kategori
        rules['category'] = category
        
        print("\n--- HASIL SCAN (Rules) ---")
        print(json.dumps(rules, indent=2))
        
        # Simpan ke file spesifik kategori (contoh: rules_skripsi.json)
        output_filename = f'rules_{category}.json'
        with open(output_filename, 'w') as f:
            json.dump(rules, f, indent=2)
            print(f"\n>> Rules disimpan ke '{output_filename}'")
            
    except Exception as e:
        print(f"Error: {e}")
