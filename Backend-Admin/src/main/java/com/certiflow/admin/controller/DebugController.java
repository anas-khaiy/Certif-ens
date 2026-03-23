package com.certiflow.admin.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Enumeration;

@RestController
@RequestMapping("/api/v1/debug")
public class DebugController {

    @RequestMapping(value = "/**", method = { RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS })
    public void debug(HttpServletRequest request) {
        System.out.println("DEBUG: Request received");
        System.out.println("  Method: " + request.getMethod());
        System.out.println("  URI: " + request.getRequestURI());
        System.out.println("  Headers:");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            System.out.println("    " + name + ": " + request.getHeader(name));
        }
    }
}
