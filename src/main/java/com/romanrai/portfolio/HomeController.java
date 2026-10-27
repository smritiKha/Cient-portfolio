package com.romanrai.portfolio;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String home() {
        return "redirect:/culinary_art_in_motion.html";
    }

    @GetMapping("/admin")
    public String admin() {
        return "redirect:/admin/login.html";
    }
}