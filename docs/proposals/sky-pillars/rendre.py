from pathlib import Path
import fitz
p=Path(__file__).parent.resolve()
doc=fitz.open(p/'SKY-PILLARS-planche.svg')
pdf=fitz.open('pdf',doc.convert_to_pdf())
pdf[0].get_pixmap(matrix=fitz.Matrix(1,1)).save(p/'SKY-PILLARS-planche.png')
pdf[0].get_pixmap(matrix=fitz.Matrix(.5,.5)).save(p/'apercu.png')
