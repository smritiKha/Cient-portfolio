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
        public String about = "My culinary experience spans professional kitchens in India and the UAE, with a focus on sushi preparation, station leadership, consistent execution, and thoughtful service. I value precise technique, strong teamwork, and the discipline required to deliver quality throughout service.";
        public String email = "theromanrai@gmail.com";
        public String phone = "0568493578";
        public String location = "Burjuman, Dubai, UAE";
        public String availability = "Open to meaningful opportunities for culinary growth and collaboration.";
        public String referenceNote = "Professional references available upon request.";
        public String portrait = "/images/me.png";
        public String resumeUrl = "";
        public String[] skills = {"Plating and presentation", "Composure during service", "Food quality and consistency", "Kitchen team leadership", "Cross-team collaboration", "Service and time management", "Mise en place", "Stock control and rotation"};
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
