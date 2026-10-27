package com.romanrai.portfolio;

import java.util.ArrayList;
import java.util.List;

public class PortfolioData {
    public int schemaVersion;
    public Profile profile = new Profile();
    public List<Dish> dishes = new ArrayList<>();
    public String signatureDishId;
    public String compositionDishId;
    public boolean dishesManaged;
    public boolean staticDishesSeeded;
    public List<Experience> experience = new ArrayList<>();
    public boolean experienceManaged;

    public static class Profile {
        public String name = "Roman Rai";
        public String role = "Senior Chef de Partie";
        public String headline = "COOKING WITH PURPOSE";
        public String about = "I’m a culinary professional with experience in restaurant kitchens and operations in India and the UAE. My work has covered ingredient preparation, sushi, station coordination, and inventory. I’m looking to keep growing while contributing steady, thoughtful service.";
        public String email = "theromanrai@gmail.com";
        public String phone = "0568493578";
        public String location = "Burjuman, Dubai, UAE";
        public String availability = "Open to senior chef de partie opportunities.";
        public String referenceNote = "Professional references available upon request.";
        public String portrait = "/images/me.png";
        public String resumeUrl = "";
        public String[] skills = {"Food plating and garnish", "Working under pressure", "Quality and consistency", "Team leadership", "Teamwork", "Time management", "Mise en place", "Stock control and rotation"};
        public String[] education = {
            "Intermediate School | Buddha Smriti Education Foundation | 2018 | 3.65 CGPA",
            "High School Diploma | Devi Secondary School | 2018–2020 | 3.21 CGPA"
        };
        public String[] languages = {"English", "Hindi"};
    }

    public static class Dish {
        public String id;
        public String title;
        public String cuisine;
        public String description;
        public String image;
        public String imageFit = "cover";
        public String sauce;
        public String protein;
        public String herbs;
        public String garnish;
        public String texture;
    }

    public static class Experience {
        public String id;
        public String venue;
        public String role;
        public String location;
        public String dates;
        public String details;
    }
}
