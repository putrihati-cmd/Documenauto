from docx import Document
from docx.shared import Cm

doc = Document()
# Margin 4-4-3-3 (Standar Skripsi)
section = doc.sections[0]
section.top_margin = Cm(4)
section.left_margin = Cm(4)
section.bottom_margin = Cm(3)
section.right_margin = Cm(3)

doc.add_paragraph("Ini adalah Master Skripsi yang Benar.")
doc.save('master_skripsi_generated.docx')
print("Master Skripsi created.")
