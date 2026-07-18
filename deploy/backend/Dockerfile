# ============================================
# Backend Dockerfile — Multi-stage build
# ============================================
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/* \
    && mvn clean package -DskipTests -q

# ============================================
# Runtime
# ============================================
FROM eclipse-temurin:21-jre

WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /app/target/*.jar app.jar

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
