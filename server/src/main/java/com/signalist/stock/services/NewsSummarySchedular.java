package com.signalist.stock.services;

import com.signalist.stock.entity.User;
import com.signalist.stock.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NewsSummarySchedular {
    private final UserRepository userRepository;
    private final NewsAggregatorService newsAggregatorService;

    public NewsSummarySchedular(UserRepository userRepository,NewsAggregatorService  newsAggregatorService){
        this.userRepository = userRepository;
        this.newsAggregatorService = newsAggregatorService;
    }

    @Scheduled(cron = "0 0 0/4 * * ?", zone = "Asia/Kolkata")
    public void sendDailySummaries(){
        for(User user: userRepository.findAll()){
            try{
                newsAggregatorService.processAndSendForUser(user);
            }catch (Exception e){
                System.err.println("Failed to send news summary for " + user.getEmail() + ": " + e.getMessage());
            }
        }
    }
//
//    @Scheduled(cron = "0 * * * * ?")
//    public void sendDailySummariesTest(){
//        sendDailySummaries();
//    }
}
