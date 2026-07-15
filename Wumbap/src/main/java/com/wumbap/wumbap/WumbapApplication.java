package com.wumbap.wumbap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WumbapApplication {

	public static void main(String[] args) {
		SpringApplication.run(WumbapApplication.class, args);
	}

}
