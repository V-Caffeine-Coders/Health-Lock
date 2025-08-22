from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
import os

def create_downloadable_pdf(report_text, output_path):
    """
    Creates a downloadable PDF from the GenAI-generated text report.
    
    Args:
        report_text (str): The text content of the report.
        output_path (str): The full path to save the PDF file.
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    story = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=24, spaceAfter=20, alignment=1)
    
    story.append(Paragraph("Your Personalized Health Report", title_style))
    story.append(Spacer(1, 12))
    
    paragraphs = report_text.split('\n\n')
    for para_text in paragraphs:
        if para_text.strip():
            story.append(Paragraph(para_text.strip(), styles['Normal']))
            story.append(Spacer(1, 12))
    
    try:
        doc.build(story)
        print(f"PDF report successfully created at {output_path}")
        return output_path
    except Exception as e:
        print(f"Error creating PDF: {e}")
        return None

# Assuming master_report_text is already populated
# from your GenAI model (e.g., master_report_text = "...")

# Define the folder and filename
output_folder = r"D:\my_code_profile\Sunhacks\Health-Lock\AIworking\output\download"
output_filename = "health_report_123.pdf"

# Create the folder if it doesn't exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Construct the full path for the output file
output_path = os.path.join(output_folder, output_filename)

# Call the function with the correct arguments
pdf_file_path = create_downloadable_pdf("Your sample report text.", output_path)

if pdf_file_path:
    print(f"File is ready for download at: {pdf_file_path}")