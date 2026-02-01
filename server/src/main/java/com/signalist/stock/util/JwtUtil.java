package com.signalist.stock.util;

import com.signalist.stock.dto.CustomUserDetails;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private Key key;

    @PostConstruct
    public void init(){
        key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(UserDetails userDetails){
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);

        var builder = Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiry);

        // add extra claims from CustomUserDetails but NOT the password as it is not secure to add the password ion the payload
        if (userDetails instanceof CustomUserDetails cu) {
            builder.claim("id", cu.getId().toString());
            builder.claim("name", cu.getName());
            builder.claim("email", cu.getEmail());
        }

        return builder.signWith(key, SignatureAlgorithm.HS256).compact();
    }

    public String getUserNameFromToken(String token){
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateUser(String token, UserDetails userDetails){
        try{
            final String usernameFromToken = getUserNameFromToken(token);
            return (usernameFromToken != null
                    && usernameFromToken.equals(userDetails.getUsername())
                    && !isTokenExpired(token));
        }catch (JwtException | IllegalArgumentException ex){
            return false;
        }
    }

    public boolean isTokenExpired(String token){
        Date exp = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getExpiration();

        return exp.before(new Date());
    }
}
