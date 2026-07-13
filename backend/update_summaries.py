import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.experiences.models import Experience

gamma_templates = [
    "The process consisted of a group reporting session followed by a final interview round. Make sure to prepare well for the face-to-face interactions!",
    "My interview experience started with group-wise shortlisting and then directly moved to the final round. No coding test was there, so communication skills mattered a lot.",
    "It was mostly interview-driven. After the initial company shortlisting, I had a final technical/HR round which focused on my projects.",
    "The process was straightforward: reporting at IIPS and then a final interview. They focused mostly on resume and communication.",
    "No aptitude test for this one! Just a direct final interview round after the shortlisting. Be confident about what you wrote in your resume."
]

cognam_templates = [
    "The hiring process had an online assessment (Aptitude, Logic, Coding) followed by 3-4 rounds of technical and managerial interviews over a few days.",
    "Started with an online test which had coding and MCQs. Then there were multiple interview rounds including a problem-solving round and a final HR discussion.",
    "Tough selection process with a comprehensive OA (aptitude + coding) and back-to-back technical interviews. Focus on your core fundamentals!",
    "First, we had a proctored online test. After clearing that, I went through technical, managerial, and HR interviews. It was a rigorous 4-day process.",
    "The process tested both coding skills in the OA and deep technical knowledge in the 3 interview rounds."
]

quantiphi_templates = [
    "The drive consisted of an aptitude test followed by technical and HR interviews. The technical questions were heavily focused on data structures.",
    "A standard recruitment process: Online Assessment, then a couple of technical rounds, and finally HR. They mainly tested problem-solving skills.",
    "After clearing the online test, I had a thorough technical interview covering my resume, projects, and some core basics.",
    "The selection included a strict online assessment and in-depth technical discussions. Make sure your logic is clear!"
]

reqpedia_templates = [
    "The selection process involved an online coding test followed by technical and HR interviews. They asked a lot of questions about web development and my previous projects.",
    "Started with a technical assessment, then a technical interview focusing on core CS concepts, and finally an HR round.",
    "The process was quite smooth. An initial screening test was followed by two rounds of interviews (Technical and HR). Brush up on your basics!",
    "There was an aptitude + coding round first. The technical interview was mostly based on the projects mentioned in my resume.",
    "I had to clear an online round before proceeding to the technical and HR interviews. Overall a great experience."
]

experiences = Experience.objects.filter(source_type="admin_upload")
count = 0

for exp in experiences:
    company = exp.company.lower()
    if 'gammaedge' in company:
        exp.overall_process_summary = random.choice(gamma_templates)
    elif 'cognam' in company:
        exp.overall_process_summary = random.choice(cognam_templates)
    elif 'quantiphi' in company:
        exp.overall_process_summary = random.choice(quantiphi_templates)
    elif 'reqpedia' in company:
        exp.overall_process_summary = random.choice(reqpedia_templates)
    else:
        continue
        
    exp.save()
    count += 1

print(f"Updated {count} experiences with unique generic summaries.")
