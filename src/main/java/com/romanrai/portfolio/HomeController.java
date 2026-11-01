package com.romanrai.portfolio;

import org.springframework.stereotype.Controller;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }

    @GetMapping("/culinary_art_in_motion.html")
    public String legacyPortfolioUrl() {
        return "redirect:/";
    }

    @GetMapping("/cv")
    public String cv() {
        return "forward:/cv.html";
    }

    @GetMapping("/cv/download")
    public ResponseEntity<Resource> downloadCv() {
        Resource pdf = new ClassPathResource("static/Roman_Rai_CV.pdf");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Roman_Rai_CV.pdf\"")
                .body(pdf);
    }

    @GetMapping("/admin")
    public String admin() {
        return "redirect:/admin/login.html";
    }
}
