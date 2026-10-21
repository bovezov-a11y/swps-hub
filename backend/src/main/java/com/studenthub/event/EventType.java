package com.studenthub.event;

public enum EventType {
    LECTURE("Lecture"),
    CLASS("Class"),
    LAB("Lab"),
    EXAM("Exam"),
    DEADLINE("Deadline"),
    OTHER("Other");

    private final String label;

    EventType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
