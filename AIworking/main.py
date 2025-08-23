# main.py

import shutil
import sys
import os
import json
from time import time

# Assuming these functions are defined in your other files and you can import them
from conversion import convert_pdfs_to_json
from MasterReport import generate_master_report
from Download import create_downloadable_pdf, extract_dashboard_data

def main():
    # Get the file path from command line arguments
    if len(sys.argv) < 3:
        # If not enough arguments, print usage and exit with an error code
        print(json.dumps({
            "status": "error",
            "message": "Usage: python main.py <path_to_uploaded_pdf> <output_pdf_filename>"
        }))
        sys.exit(1)
        
    uploaded_pdf_path = sys.argv[1]
    desired_output_pdf_filename = sys.argv[2] # e.g., "John_Doe_health_report_1678912345.pdf"

    # Define temporary and final output directories (relative to main.py's location)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create a temporary folder to process the single PDF
    # This ensures your `convert_pdfs_to_json` (which expects a folder) can work.
    temp_pdf_input_folder = os.path.join(base_dir, f"temp_pdf_input_{int(time())}")
    os.makedirs(temp_pdf_input_folder, exist_ok=True)
    
    # Copy the uploaded PDF into the temporary processing folder
    shutil.copy(uploaded_pdf_path, temp_pdf_input_folder)

    json_output_folder = os.path.join(base_dir, "output/json") # This is where consolidated_reports.json will go
    pdf_download_folder = os.path.join(base_dir, "downloads") # This is where the final PDF goes for Node.js to serve

    # Ensure output directories exist
    os.makedirs(json_output_folder, exist_ok=True)
    os.makedirs(pdf_download_folder, exist_ok=True)

    try:
        # Step 1: Convert the PDF(s) in the temporary folder to JSON
        # Your `convert_pdfs_to_json` expects a folder, so we use the temp one.
        convert_pdfs_to_json(temp_pdf_input_folder, json_output_folder)

        # Step 2: Load the consolidated JSON data
        consolidated_json_path = os.path.join(json_output_folder, 'consolidated_reports.json')
        with open(consolidated_json_path, 'r', encoding='utf-8') as f:
            reports_data = json.load(f)

        # Basic check to ensure some data was parsed
        if not reports_data:
            raise ValueError("No health data was extracted from the uploaded PDF(s).")

        # Step 3: Generate the master report text using the GenAI model
        master_report_text = generate_master_report(reports_data)
        
        if not master_report_text or master_report_text == "Could not generate report.":
            raise RuntimeError("GenAI failed to generate the master report.")

        # Step 4: Extract dashboard data from the master report
        dashboard_data = extract_dashboard_data(master_report_text)
        
        # Step 5: Create the downloadable PDF
        final_pdf_output_path = os.path.join(pdf_download_folder, desired_output_pdf_filename)
        pdf_file_path = create_downloadable_pdf(master_report_text, final_pdf_output_path)

        if not pdf_file_path:
            raise RuntimeError("Failed to create the downloadable PDF.")

        # Print the dashboard data as JSON to stdout for Node.js to capture
        # Also include the generated PDF's filename so Node.js knows which file to serve.
        dashboard_data['download_filename'] = desired_output_pdf_filename
        print(json.dumps(dashboard_data))
        
        sys.exit(0) # Exit successfully
        
    except FileNotFoundError as e:
        print(json.dumps({
            "status": "error",
            "message": f"Required file not found: {e}"
        }))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(json.dumps({
            "status": "error",
            "message": f"Failed to parse JSON data: {e}"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"An unexpected error occurred during processing: {e}"
        }))
        sys.exit(1)
    finally:
        # Clean up the temporary PDF input folder and its contents
        if os.path.exists(temp_pdf_input_folder):
            shutil.rmtree(temp_pdf_input_folder)
        # Also, consider cleaning up the consolidated_reports.json after use
        if os.path.exists(consolidated_json_path):
            os.remove(consolidated_json_path)

if __name__ == "__main__":
    main()