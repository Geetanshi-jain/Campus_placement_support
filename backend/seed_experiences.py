import os
import django
import csv
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.experiences.models import Experience

csv_path = r'C:\Users\jaing\OneDrive\Desktop\campus_placement_Support\data\Deive_summary\IIPS_Placement_RAG_Data.csv'

added_count = 0

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        company = row.get('company', '').strip()
        names_str = row.get('selected_candidate_names', '')
        timeline = row.get('date_timeline', '')
        process = row.get('hiring_process', '')
        package = row.get('package_stipend', '')
        notes = row.get('additional_notes', '')

        if 'N/A' in names_str or not names_str:
            continue
        
        # Extract names (often separated by commas or semicolons)
        names = [n.strip() for n in re.split(r'[,;|]', names_str) if n.strip() and len(n.strip()) > 2 and 'Round' not in n]
        
        for name in names:
            if added_count >= 10:
                break
                
            batch_match = re.search(r'202\d', timeline)
            batch = batch_match.group(0) if batch_match else '2025'

            # Try to map to VERDICT_CHOICES
            verdict = "selected"

            Experience.objects.create(
                company=company,
                author=name,
                batch=batch,
                verdict=verdict,
                overall_process_summary=process,
                tips_advice=notes,
                ctc_offered=package,
                role_offered="SDE / IT Role",
                source_type="admin_upload"
            )
            added_count += 1
            print(f"Added {name} for {company}")
            
        if added_count >= 10:
            break

print(f"Successfully added {added_count} experiences.")
