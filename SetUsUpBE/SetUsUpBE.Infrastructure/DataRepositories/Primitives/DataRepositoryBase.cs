using Microsoft.EntityFrameworkCore;

namespace SetUsUpBE.Infrastructure.DataRepositories.Primitives;

public class DataRepositoryBase<TContext>
    where TContext : Microsoft.EntityFrameworkCore.DbContext
{
    protected DbContextOptions<TContext> options;

    public DataRepositoryBase(DbContextOptions<TContext> options)
    {
        this.options = options;
    }
}
