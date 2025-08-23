import os
import time
import json
import google.generativeai as genai
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

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

def extract_dashboard_data(master_report_text):
    """
    Asks GenAI to extract key metrics from the master report text
    and format them as JSON for a dashboard.
    """
    load_dotenv()
    google_api_key = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=google_api_key)
    
    prompt_template = """
    You are a data extraction assistant. Analyze the following health report summary and extract the most critical data points. Format the output as a single JSON object.

    Extract the following fields:
    - `patient_name`: The name of the patient.
    - `last_report_date`: The date of the most recent report.
    - `last_abnormal_finding`: The most important or latest concerning health metric. Provide a brief, simple explanation. If no abnormal finding is mentioned, use "No abnormal findings."

    Ensure the output is valid JSON, with no extra text or characters.

    Here is the health report summary:
    {report_text}
    """
    
    full_prompt = prompt_template.replace("{report_text}", master_report_text)
    
    model = genai.GenerativeModel('gemini-1.0-pro')
    
    try:
        response = model.generate_content(full_prompt)
        dashboard_data = json.loads(response.text)
        return dashboard_data
    except Exception as e:
        print(f"Error extracting dashboard data: {e}")
        return {
            "patient_name": "Not found",
            "last_report_date": "Not found",
            "last_abnormal_finding": "Could not extract data."
        }