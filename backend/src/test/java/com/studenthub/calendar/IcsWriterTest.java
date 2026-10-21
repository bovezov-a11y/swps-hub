package com.studenthub.calendar;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class IcsWriterTest {

    @Test
    void escapesCharactersWithSpecialMeaning() {
        assertThat(IcsWriter.escape("Room 1, Building A; bring\\calculator\nand ID"))
                .isEqualTo("Room 1\\, Building A\\; bring\\\\calculator\\nand ID");
    }

    @Test
    void foldsLongLinesAt75OctetsWithoutSplittingCharacters() {
        String line = "SUMMARY:" + "Psychologia społeczna – egzamin końcowy ".repeat(4);

        String[] parts = IcsWriter.fold(line).split("\r\n");

        assertThat(parts).hasSizeGreaterThan(1);
        for (String part : parts) {
            assertThat(part.getBytes(StandardCharsets.UTF_8).length).isLessThanOrEqualTo(75);
        }
        for (int i = 1; i < parts.length; i++) {
            assertThat(parts[i]).startsWith(" ");
        }
        StringBuilder unfolded = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            unfolded.append(parts[i].substring(1));
        }
        assertThat(unfolded.toString()).isEqualTo(line);
    }

    @Test
    void leavesShortLinesUnchanged() {
        assertThat(IcsWriter.fold("SUMMARY:Exam")).isEqualTo("SUMMARY:Exam");
    }
}
