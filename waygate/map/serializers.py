#!/usr/bin/env python3

from rest_framework import serializers

from .models import Book, Chapter, Character, Narrator, Point


class PointSerializer(serializers.ModelSerializer):
    class Meta:
        model = Point
        fields = (
            "narrator",
            "x",
            "y",
            "type"
        )


class NarratorSerializer(serializers.ModelSerializer):
    points = PointSerializer(many=True, read_only=True)

    class Meta:
        model = Narrator
        fields = ("chapter", "character", "points",)


class ChapterSerializer(serializers.ModelSerializer):
    narrators = NarratorSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ("chapter_number", "chapter_name", "period", "summary", "narrators",)
