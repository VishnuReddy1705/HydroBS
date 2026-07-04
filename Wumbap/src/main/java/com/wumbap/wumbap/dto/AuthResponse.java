// src/main/java/com/wumbap/wumbap/dto/AuthResponse.java
package com.wumbap.wumbap.dto;

public record AuthResponse(String token, String fullName, String role) {}