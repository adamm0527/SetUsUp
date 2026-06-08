namespace SetUsUpBE.WebAPI.Configuration;

public static class JwtConfiguration
{
    public static string SwaggerAudience { get; }
        = "http://localhost:5072"; // Swagger

    public static string ReactAudience { get; }
        = "http://localhost:5173"; // REACT Frontend

    public static string Secret { get; }
        = "e8365c8d3a68758646e5ac88ccc6dbf63546b6cd6e82317acab81a13dbc911a915a5e5cb24255303777e8ae162c45562d128a674edd6d4d6c0fb0366ec0a0e29";
}
