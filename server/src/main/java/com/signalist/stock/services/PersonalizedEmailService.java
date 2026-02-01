package com.signalist.stock.services;

import com.signalist.stock.entity.User;
import com.signalist.stock.util.GeminiClient;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Map;

@Service
public class PersonalizedEmailService {

    private final GeminiClient geminiClient;
    private final JavaMailSender javaMailSender;
    private final PromptService promptService;
    private final TemplateService templateService;

    public PersonalizedEmailService(GeminiClient geminiClient,
                                    JavaMailSender javaMailSender,
                                    PromptService promptService,
                                    TemplateService templateService) {
        this.geminiClient = geminiClient;
        this.promptService = promptService;
        this.javaMailSender = javaMailSender;
        this.templateService = templateService;
    }

    private String buildUserProfile(User u){
        StringBuilder sb = new StringBuilder();
        sb.append("fullName: ").append(u.getFullName()).append("; ");
        sb.append("email: ").append(u.getEmail()).append("; ");
        if(u.getCountry() != null) sb.append("country: ").append(u.getCountry()).append("; ");
        if(u.getInvestmentGoals() != null) sb.append("investmentGoals: ").append(u.getInvestmentGoals()).append("; ");
        if(u.getPreferredIndustry() != null) sb.append("preferredIndustry: ").append(u.getPreferredIndustry()).append("; ");
        return sb.toString();
    }

    @Async
    public void generateAndSendWelcomeEmail(User user) throws Exception {
        try {
            String userProfile = buildUserProfile(user);

            // load and render the prompt that drives Gemini
            String prompt = promptService.loadPrompt("personalized_welcome_prompt.txt");
            String body = promptService.render(prompt, Map.of("userProfile", userProfile, "name", user.getFullName()));

            // get generated HTML (or fragment) from Gemini
            String generatedHtml = geminiClient.generate(body);
            if (generatedHtml == null || generatedHtml.isBlank()) {
                throw new IllegalStateException("Gemini returned empty body");
            }

            // load the email template and inject the generated HTML into the {{intro}} placeholder
            String template = templateService.loadTemplate("welcome.html");
            String finalHtml = templateService.render(template, Map.of(
                    "name", user.getFullName(),
                    "userProfile", userProfile,
                    "intro", generatedHtml
            ));

            sendHtmlEmail(user.getEmail(), "Welcome Aboard " + user.getFullName(), finalHtml);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody){
        try{
            // validate recipient(s)
            InternetAddress[] addresses = InternetAddress.parse(to, true);
            for (InternetAddress addr : addresses) {
                addr.validate();
            }
            String[] toArray = Arrays.stream(addresses)
                    .map(InternetAddress::getAddress)
                    .toArray(String[]::new);

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message,"utf-8");
            helper.setTo(toArray);
            helper.setSubject(subject);
            helper.setText(htmlBody,true);
            javaMailSender.send(message);
        } catch (AddressException ae){
            throw new IllegalArgumentException("Invalid recipient email: " + to, ae);
        } catch (Exception ex){
            throw new RuntimeException("Failed to send email", ex);
        }
    }
}