using EVStation_basedRentalSystem.Services.AuthAPI.Models;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using EVStation_basedRentalSystem.Services.AuthAPI.Service.IService;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service
{
    public class TokenIntrospectionService : ITokenIntrospectionService
    {
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly JwtOptions _jwtOptions;

        public TokenIntrospectionService(IJwtTokenGenerator jwtTokenGenerator, IOptions<JwtOptions> jwtOptions)
        {
            _jwtTokenGenerator = jwtTokenGenerator;
            _jwtOptions = jwtOptions.Value;
        }

        /// <summary>
        /// Introspect a token directly
        /// </summary>
        public async Task<IntrospectResponseDto> IntrospectAsync(IntrospectRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                return new IntrospectResponseDto { IsValid = false, Message = "Token is missing." };

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtOptions.Secret);

                var principal = tokenHandler.ValidateToken(request.Token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _jwtOptions.Issuer,
                    ValidAudience = _jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var roles = principal.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

                return new IntrospectResponseDto
                {
                    IsValid = true,
                    UserId = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value,
                    ExpiresAt = jwtToken.ValidTo,
                    Roles = roles,
                    Message = "Token is valid."
                };
            }
            catch
            {
                return new IntrospectResponseDto
                {
                    IsValid = false,
                    Message = "Invalid or expired token."
                };
            }
        }

        /// <summary>
        /// Introspect a token from HttpRequest (Authorization header)
        /// </summary>
        public async Task<IntrospectResponseDto> IntrospectTokenAsync(HttpRequest request)
        {
            if (!request.Headers.TryGetValue("Authorization", out var authHeader))
                return new IntrospectResponseDto { IsValid = false, Message = "Authorization header missing." };

            var token = authHeader.ToString().Replace("Bearer ", "");
            return await IntrospectAsync(new IntrospectRequestDto { Token = token });
        }
    }
}
