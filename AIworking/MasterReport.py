import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

google_api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=google_api_key)

def generate_master_report(reports_json_list):
    """
    Generates a master report using a GenAI model from a list of JSON reports.
    """
    sorted_reports = sorted(reports_json_list, key=lambda x: x.get('report_date', '1900-01-01'), reverse=True)
    
    prompt_template = """
    You are an expert health assistant for a patient named John Doe. Your task is to analyze the following JSON health report data and create a comprehensive, single-page health summary.

    Instructions for the master report:
    1.  The report must be **easy to understand** for a non-medical professional. Avoid jargon.
    2.  Organize the information chronologically, with the **latest report date first**.
    3.  Create a separate heading for each report, e.g., "Report from [Date]".
    4.  **Highlight and provide a simple explanation for any abnormal or out-of-range results**. This is a critical requirement.
    5.  Include key patient details (name, age, gender) at the top of the report.
    6.  The report should be concise yet informative.

    Here is the health report data in a JSON list:
    {reports_json_string}
    """
    
    reports_json_string = json.dumps(sorted_reports, indent=2)
    full_prompt = prompt_template.replace("{reports_json_string}", reports_json_string)
    
    model = genai.GenerativeModel("gemini-2.5-flash")
    try:
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        print(f"An error occurred while generating the report: {e}")
        return "Could not generate report."

# Example Usage:
try:
    with open('D:\\my_code_profile\\Sunhacks\\Health-Lock\\AIworking\\json\\consolidated_reports.json', 'r', encoding='utf-8') as f:
        reports_data = json.load(f)
except FileNotFoundError:
    print("Error: consolidated_reports.json not found.")
    reports_data = []

# Generate the master report text
master_report_text = generate_master_report(reports_data)

# ------------------------------------------------------------------
# This section has been updated to save the file to a specific folder.
# ------------------------------------------------------------------

# Define the folder to save the report
output_folder = "D:\\my_code_profile\\Sunhacks\\Health-Lock\\AIworking\\output"
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Define the full path for the output file
output_file_path = os.path.join(output_folder, 'master_report.txt')

# Save the master report to the file
if master_report_text and master_report_text != "Could not generate report.":
    try:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(master_report_text)
        print(f"\nMaster report saved successfully to {output_file_path}")
    except Exception as e:
        print(f"Failed to save the master report: {e}")