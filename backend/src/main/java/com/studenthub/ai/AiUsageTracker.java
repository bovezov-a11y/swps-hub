package com.studenthub.ai;

import com.studenthub.common.CodedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

/** Counts AI generations per user and day in the university's time zone. */
@Component
class AiUsageTracker {

    private final JdbcClient jdbc;
    private final ZoneId zone;

    AiUsageTracker(JdbcClient jdbc, @Value("${app.time-zone}") ZoneId zone) {
        this.jdbc = jdbc;
        this.zone = zone;
    }

    int usedToday(UUID userId) {
        return jdbc.sql("select requests from ai_usage where user_id = :userId and day = :day")
                .param("userId", userId)
                .param("day", LocalDate.now(zone))
                .query(Integer.class)
                .optional()
                .orElse(0);
    }

    /**
     * Records one generation, or refuses when the limit is reached. The increment is a single upsert, so parallel
     * requests cannot both slip under the limit; exceeding it rolls the increment back.
     */
    @Transactional
    void consume(UUID userId, int dailyLimit) {
        int used = jdbc.sql("""
                        insert into ai_usage (user_id, day, requests) values (:userId, :day, 1)
                        on conflict (user_id, day) do update set requests = ai_usage.requests + 1
                        returning requests
                        """)
                .param("userId", userId)
                .param("day", LocalDate.now(zone))
                .query(Integer.class)
                .single();
        if (used > dailyLimit) {
            throw new CodedException(HttpStatus.TOO_MANY_REQUESTS, "AI_DAILY_LIMIT",
                    "You have used all %d AI generations for today. Try again tomorrow.".formatted(dailyLimit));
        }
    }
}
