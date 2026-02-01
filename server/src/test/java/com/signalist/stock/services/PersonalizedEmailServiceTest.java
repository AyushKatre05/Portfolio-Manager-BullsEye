//package com.signalist.stock.services;
//
//import com.signalist.stock.entity.User;
//import com.signalist.stock.util.GeminiClient;
//import jakarta.mail.BodyPart;
//import jakarta.mail.Multipart;
//import jakarta.mail.Session;
//import jakarta.mail.internet.MimeMessage;
//import org.junit.jupiter.api.Test;
//
//import java.util.Properties;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.anyString;
//import static org.mockito.Mockito.*;
//
//public class PersonalizedEmailServiceTest {
//
//    @Test
//    public void testGenerateAndSendWelcomeEmail_sendsHtmlEmail() throws Exception {
//        // Arrange: mocks
//        GeminiClient geminiClient = mock(GeminiClient.class);
//        PromptService promptService = mock(PromptService.class);
//        org.springframework.mail.javamail.JavaMailSender mailSender = mock(org.springframework.mail.javamail.JavaMailSender.class);
//
//        // prepare a real MimeMessage that the code will populate
//        MimeMessage mimeMessage = new MimeMessage(Session.getDefaultInstance(new Properties()));
//        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
//        // ensure send does nothing (avoid actual mail send)
//        doNothing().when(mailSender).send(any(MimeMessage.class));
//
//        when(promptService.loadPrompt("personalized_welcome_prompt")).thenReturn("STATIC_PROMPT");
//        // Stub render to return a non-null prompt body so Gemini is called with a real string
//        when(promptService.render(anyString(), any())).thenReturn("RENDERED_PROMPT_BODY");
//        when(geminiClient.generate(anyString())).thenReturn("<p class=\"mobile-text\">Hi <strong>Test</strong>.</p>");
//
//        PersonalizedEmailService service = new PersonalizedEmailService(geminiClient, mailSender, promptService,templateService);
//
//        User user = new User();
//        user.setFullName("Test User");
//        user.setEmail("test@example.com");
//        user.setCountry("India");
//        user.setInvestmentGoals("Long-term growth");
//        user.setPreferredIndustry("Technology");
//        user.setPassword("password");
//
//        // Act
//        service.generateAndSendWelcomeEmail(user);
//
//        // Assert - capture and verify
//        verify(mailSender, times(1)).send(any(MimeMessage.class));
//
//        MimeMessage sent = mimeMessage; // our message instance was populated directly
//        assertNotNull(sent.getAllRecipients());
//        assertEquals("test@example.com", sent.getAllRecipients()[0].toString());
//        assertEquals("Welcome Aboard Test User", sent.getSubject());
//
//        Object content = sent.getContent();
//        String html;
//        if (content instanceof String) {
//            html = (String) content;
//        } else if (content instanceof Multipart) {
//            Multipart mp = (Multipart) content;
//            BodyPart bp = mp.getBodyPart(0);
//            Object partCont = bp.getContent();
//            html = partCont == null ? "" : partCont.toString();
//        } else {
//            html = content == null ? "" : content.toString();
//        }
//
//        assertTrue(html.contains("<p class=\"mobile-text\">"));
//        assertTrue(html.contains("<strong>Test</strong>") || html.contains("Test"));
//    }
//}
