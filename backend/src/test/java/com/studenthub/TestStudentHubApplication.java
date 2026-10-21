package com.studenthub;

import org.springframework.boot.SpringApplication;

public class TestStudentHubApplication {

	public static void main(String[] args) {
		SpringApplication.from(StudentHubApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
