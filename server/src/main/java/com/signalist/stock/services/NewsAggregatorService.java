package com.signalist.stock.services;

import com.signalist.stock.entity.User;
import com.signalist.stock.util.GeminiClient;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NewsAggregatorService {
    private final WishListService wishListService;
    private final FinnubService finnubService;
    private final GeminiClient geminiClient;
    private final PromptService promptService;
    private final TemplateService templateService;
    private final PersonalizedEmailService emailService;

    private static final int MAX_ARTICLES = 6;

    public NewsAggregatorService(WishListService wishListService,FinnubService finnubService,GeminiClient geminiClient,PromptService promptService, PersonalizedEmailService emailService,TemplateService templateService){
        this.wishListService = wishListService;
        this.finnubService = finnubService;
        this.geminiClient = geminiClient;
        this.promptService = promptService;
        this.templateService = templateService;
        this.emailService = emailService;
    }

    public void processAndSendForUser(User user) throws Exception {
        String email = user.getEmail();
        List<String> symbols = wishListService.getSymbolByEmail(email);
        List<Map<String, Object>> articles;

        if(!symbols.isEmpty()){
            Map<String,LinkedList<Map<String,Object>>> perSymbol = new LinkedHashMap<>();
            var to = LocalDate.now();
            var from = to.minusDays(5);

            for(String s: symbols){
                List<Map<String, Object>> list = finnubService.getCompanyNews(s,from.toString(),to.toString());
                perSymbol.put(s,new LinkedList<>(list == null ? List.of() : list));
            }

            List<Map<String,Object>> collected = new ArrayList<>();
//          outer: is a label for the outer loop.
//
//It allows you to break (or continue) a specific loop — not just the innermost one.
//
//In normal Java, break or continue only affect the innermost loop where they are written.
//
//But when you have nested loops (like the for inside another for), sometimes you want to break out of both loops at once. That’s what a labeled break does.
            outer:
            for(int r = 0; r < MAX_ARTICLES;r++){
                for(String s: perSymbol.keySet()){
                    LinkedList<Map<String,Object>> q = perSymbol.get(s);
                    if(q == null || q.isEmpty()) continue;
                    Map<String,Object> a = q.pollFirst();
                    if(a == null) continue ;
                    a.put("_symbol",s);
                    collected.add(a);
                    if(collected.size() >= MAX_ARTICLES) break outer;
                }
            }
            articles = collected;
            if(articles.isEmpty()) articles = finnubService.getGeneralNews();
        }else articles = finnubService.getGeneralNews();

        if(articles == null) articles = List.of();

        String newsData = buildNewsData(articles);

        String generation = null;
        try{
            String promptTemplate = promptService.loadPrompt("news_summary_prompt.txt");
            String renderedPrompt = promptService.render(promptTemplate, Collections.singletonMap("newsData",newsData));
            generation = geminiClient.generate(renderedPrompt);
        }catch (Exception ex){
            generation = null;
        }

        String template = templateService.loadTemplate("nrwsummary.html");
        String date = LocalDate.now().toString();
        assert generation != null;
        Map<String, String> values = Map.of(
                "date", date,
                "newsContent", generation
        );

        String finalEmailContent = templateService.render(template,values);

        emailService.sendHtmlEmail(user.getEmail(),"Daily News Summary",finalEmailContent);
    }

    private String buildNewsData(List<Map<String,Object>> articles){
        return articles.stream()
                .limit(MAX_ARTICLES)
                .map(a -> {
                    String symbol = Objects.toString(a.get("_symbol"),"");
                    String headLine = Objects.toString(a.get("headline"), Objects.toString(a.get("title"),""));
                    String url = Objects.toString(a.get("url"),"");
                    String source = Objects.toString(a.get("source"),"");
                    return String .format("%s %s\nSource: %s\nURL: %s\n", symbol.isEmpty() ? "" : ("[" + symbol + "]"), headLine, source, url);
                })
                .collect(Collectors.joining("\n---\n"));
    }
}