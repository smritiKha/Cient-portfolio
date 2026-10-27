
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src
COPY culinary_art_in_motion.html ./culinary_art_in_motion.html

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-10000}"]
