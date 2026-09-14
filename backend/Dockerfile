FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/OTTPro.API/OTTPro.API.csproj", "src/OTTPro.API/"]
COPY ["src/OTTPro.Application/OTTPro.Application.csproj", "src/OTTPro.Application/"]
COPY ["src/OTTPro.Domain/OTTPro.Domain.csproj", "src/OTTPro.Domain/"]
COPY ["src/OTTPro.Infrastructure/OTTPro.Infrastructure.csproj", "src/OTTPro.Infrastructure/"]
RUN dotnet restore "src/OTTPro.API/OTTPro.API.csproj"
COPY . .
WORKDIR "/src/src/OTTPro.API"
RUN dotnet build "OTTPro.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "OTTPro.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OTTPro.API.dll"]
