from django.urls import path
from .views import ask, hr_brief

urlpatterns = [
    path("ask/",      ask,      name="chat-ask"),
    path("hr-brief/", hr_brief, name="chat-hr-brief"),
]
