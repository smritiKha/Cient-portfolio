package com.romanrai.portfolio;

import org.springframework.stereotype.Controller;
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

    @GetMapping("/admin")
    public String admin() {
        return "redirect:/admin/login.html";
    }
}
