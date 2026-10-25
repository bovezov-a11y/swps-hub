package com.studenthub.insights;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** University dashboard (secured to the ADMIN role in the security configuration). */
@RestController
class InsightsController {

    private final InsightsService insights;

    InsightsController(InsightsService insights) {
        this.insights = insights;
    }

    @GetMapping("/api/insights")
    InsightsService.Insights insights() {
        return insights.insights();
    }
}
