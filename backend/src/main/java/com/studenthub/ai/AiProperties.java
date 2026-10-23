package com.studenthub.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * @param apiKey       Anthropic API key; when blank the AI study tools are switched off
 * @param dailyLimit   AI generations each user may start per day (cached results are free)
 * @param maxFileSize  largest material sent to the model; PDFs travel base64-encoded inside a 32 MB request
 */
@Validated
@ConfigurationProperties("app.ai")
record AiProperties(String apiKey, @NotBlank String model, @Positive int dailyLimit, DataSize maxFileSize) {
}
