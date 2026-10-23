package com.studenthub;

import com.studenthub.ai.StudyAids.KeyTerm;
import com.studenthub.ai.StudyAids.Question;
import com.studenthub.ai.StudyAids.Quiz;
import com.studenthub.ai.StudyAids.Summary;
import com.studenthub.ai.StudyAssistant;
import com.studenthub.mail.EmailSender;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/** Stand-ins for services that would send real emails or spend money on model calls. */
@TestConfiguration(proxyBeanMethods = false)
public class TestDoubles {

    @Bean
    @Primary
    RecordingEmailSender recordingEmailSender() {
        return new RecordingEmailSender();
    }

    @Bean
    @Primary
    FakeStudyAssistant fakeStudyAssistant() {
        return new FakeStudyAssistant();
    }

    public static class RecordingEmailSender implements EmailSender {

        private final Map<String, String> lastBodyByRecipient = new ConcurrentHashMap<>();

        @Override
        public void send(String to, String subject, String body) {
            lastBodyByRecipient.put(to, body);
        }

        public Optional<String> lastEmailTo(String address) {
            return Optional.ofNullable(lastBodyByRecipient.get(address));
        }
    }

    public static class FakeStudyAssistant implements StudyAssistant {

        public final AtomicInteger calls = new AtomicInteger();
        public volatile boolean enabled = true;

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        @Override
        public String model() {
            return "fake-model";
        }

        @Override
        public Summary summarize(StudyMaterial material) {
            calls.incrementAndGet();
            return new Summary("Overview of " + material.title(), List.of("Point one", "Point two"),
                    List.of(new KeyTerm("Term", "Definition")));
        }

        @Override
        public Quiz quiz(StudyMaterial material) {
            calls.incrementAndGet();
            return new Quiz(List.of(new Question("What is 2 + 2?", List.of("3", "4", "5", "6"), 1, "Basic arithmetic.")));
        }
    }
}
