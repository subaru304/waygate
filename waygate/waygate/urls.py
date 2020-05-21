"""waygate URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework.documentation import include_docs_urls

from map import views

router = routers.DefaultRouter()
router.register(r'book', views.BookView, 'book')
router.register(r'chapter', views.ChapterView, 'chapter')
router.register(r'character', views.ChapterView, 'character')
router.register(r'narrator', views.NarratorView, 'narrator')
router.register(r'point', views.PointView, 'point')

urlpatterns = [
    path('api/', include(router.urls)),
    path('docs/', include_docs_urls()),
    path('map/', include('map.urls')),
    path('admin/', admin.site.urls),
]
