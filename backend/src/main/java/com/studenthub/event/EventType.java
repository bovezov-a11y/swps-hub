package com.studenthub.event;

public enum EventType {
    LECTURE("Lecture"),
    CLASS("Class"),
    LAB("Lab"),
    EXAM("Exam"),
    DEADLINE("Deadline"),
    OTHER("Other"),
    /** A student's own study session; never stored as a course event. */
    STUDY("Study session");

    private final String label;

    EventType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
