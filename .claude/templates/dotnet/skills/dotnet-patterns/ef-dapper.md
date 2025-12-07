# Entity Framework + Dapper Patterns

## Entity Framework DbContext

```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

## Entity Configuration

```csharp
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Price)
            .HasPrecision(18, 2);

        builder.HasIndex(p => p.Sku)
            .IsUnique();

        builder.HasMany(p => p.OrderItems)
            .WithOne(oi => oi.Product)
            .HasForeignKey(oi => oi.ProductId);
    }
}
```

## Repository Pattern

```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _dbSet.FindAsync([id], ct);

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.ToListAsync(ct);

    public async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync(ct);
    }
}
```

## Dapper Queries

```csharp
public class ProductRepository
{
    private readonly IDbConnection _connection;

    public ProductRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IEnumerable<ProductDto>> GetProductsWithCategoryAsync(int categoryId)
    {
        const string sql = @"
            SELECT p.Id, p.Name, p.Price, c.Name AS CategoryName
            FROM Products p
            INNER JOIN Categories c ON p.CategoryId = c.Id
            WHERE p.CategoryId = @CategoryId
            ORDER BY p.Name";

        return await _connection.QueryAsync<ProductDto>(sql, new { CategoryId = categoryId });
    }

    public async Task<ProductDetailsDto?> GetProductDetailsAsync(int id)
    {
        const string sql = @"
            SELECT p.*, c.Name AS CategoryName
            FROM Products p
            LEFT JOIN Categories c ON p.CategoryId = c.Id
            WHERE p.Id = @Id;

            SELECT r.* FROM Reviews r WHERE r.ProductId = @Id;";

        using var multi = await _connection.QueryMultipleAsync(sql, new { Id = id });

        var product = await multi.ReadFirstOrDefaultAsync<ProductDetailsDto>();
        if (product is null) return null;

        product.Reviews = (await multi.ReadAsync<ReviewDto>()).ToList();
        return product;
    }

    public async Task<int> BulkInsertAsync(IEnumerable<Product> products)
    {
        const string sql = @"
            INSERT INTO Products (Name, Price, CategoryId, CreatedAt)
            VALUES (@Name, @Price, @CategoryId, @CreatedAt)";

        return await _connection.ExecuteAsync(sql, products);
    }
}
```

## Unit of Work

```csharp
public interface IUnitOfWork : IDisposable
{
    IProductRepository Products { get; }
    IOrderRepository Orders { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Products = new ProductRepository(context);
        Orders = new OrderRepository(context);
    }

    public IProductRepository Products { get; }
    public IOrderRepository Orders { get; }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);

    public void Dispose() => _context.Dispose();
}
```

## Transactions

```csharp
public async Task<Order> CreateOrderAsync(CreateOrderDto dto)
{
    await using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var order = new Order { CustomerId = dto.CustomerId, Total = 0 };
        _context.Orders.Add(order);

        foreach (var item in dto.Items)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product is null) throw new NotFoundException($"Product {item.ProductId} not found");

            order.OrderItems.Add(new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                Price = product.Price
            });

            order.Total += product.Price * item.Quantity;
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return order;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```
