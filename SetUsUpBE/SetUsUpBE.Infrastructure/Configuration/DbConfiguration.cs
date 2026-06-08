namespace SetUsUpBE.Infrastructure.Configuration;

public static class DbConfiguration
{
    public static string ConnectionString { get; }
        = "Data Source=(localdb)\\MSSQLLocalDB;" +
          "Initial Catalog=SetUsUpDB_REF;" +
          "Integrated Security=True;" +
          "Connect Timeout=30;" +
          "Encrypt=False;" +
          "Trust Server Certificate=False;" +
          "Application Intent=ReadWrite;" +
          "Multi Subnet Failover=False";

    public static string MigrationsAssembly { get; }
        = "SetUsUpBE.Infrastructure";
}
