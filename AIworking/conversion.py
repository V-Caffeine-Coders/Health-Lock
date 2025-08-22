import os
import fitz
import json
import re
from datetime import datetime

def extract_data_from_pdf(pdf_path):
    """
    Extracts structured data from a PDF, including patient details and date without time.
    """
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()

    # --- Data Parsing with Regular Expressions ---
    parsed_findings = {}

    # 1. Extract Patient Demographics
    name_match = re.search(r'Patient Name:\s*(.*?)\n', full_text, re.I)
    age_match = re.search(r'Age:\s*(.*?)\n', full_text, re.I)
    gender_match = re.search(r'Gender:\s*(.*?)\n', full_text, re.I)

    if name_match:
        parsed_findings['patient_name'] = name_match.group(1).strip()
    if age_match:
        parsed_findings['age'] = age_match.group(1).strip()
    if gender_match:
        parsed_findings['gender'] = gender_match.group(1).strip()

    # 2. Extract Report Date (revised to remove time)
    report_date = None
    date_patterns = [
        r'Date:\s*([^\n]+)',
        r'Report\s*Date:\s*([^\n]+)',
        r'Date\s*of\s*Collection:\s*([^\n]+)'
    ]
    
    date_str = None
    for pattern in date_patterns:
        date_match = re.search(pattern, full_text, re.I)
        if date_match:
            date_str = date_match.group(1).strip()
            break
            
    if date_str:
        date_formats = ['%d-%b-%Y', '%d-%B-%Y', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%d-%m-%Y']
        for fmt in date_formats:
            try:
                # Parse the string into a datetime object
                dt_obj = datetime.strptime(date_str, fmt)
                # Format the datetime object to a simple date string (YYYY-MM-DD)
                report_date = dt_obj.strftime('%Y-%m-%d')
                break
            except ValueError:
                continue

    # Add error handling for missing data
    if not report_date:
        print(f"Warning: Could not find a date in {os.path.basename(pdf_path)} with any of the specified formats.")
        
    data = {
        "filename": os.path.basename(pdf_path),
        "report_date": report_date,
        "full_text_content": full_text.replace('\n', ' ').replace('\r', ''),
        "parsed_data": parsed_findings
    }

    return data

def convert_pdfs_to_json(pdf_folder, json_folder):
    """
    Converts all PDFs in a folder to JSON files.
    """
    if not os.path.exists(json_folder):
        os.makedirs(json_folder)

    json_data_list = []
    
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(pdf_folder, filename)
            print(f"Processing {filename}...")
            
            try:
                # Extract and structure data for a single PDF
                pdf_data = extract_data_from_pdf(pdf_path)
                json_data_list.append(pdf_data)
                
            except Exception as e:
                print(f"Failed to process {filename}: {e}")

    # Save the consolidated JSON data
    output_path = os.path.join(json_folder, 'consolidated_reports.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(json_data_list, f, indent=4)
    
    print(f"\nAll reports converted and saved to {output_path}")

pdf_directory = "D:\\my_code_profile\\Sunhacks\\Health-Lock\\AIworking\\report"  # The folder with your PDFs
json_directory = "D:\\my_code_profile\\Sunhacks\\Health-Lock\\AIworking\\json"     # The empty folder you made
convert_pdfs_to_json(pdf_directory, json_directory)