package com.studenthub.mail;

/** Sends plain-text emails. Kept behind an interface so tests can capture messages instead of sending them. */
public interface EmailSender {

    void send(String to, String subject, String body);
}
