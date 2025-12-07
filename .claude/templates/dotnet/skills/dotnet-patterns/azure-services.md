# Azure Services Patterns

## Azure Key Vault

```csharp
// Program.cs configuration
var builder = WebApplication.CreateBuilder(args);

// Add Key Vault
var keyVaultUri = new Uri($"https://{builder.Configuration["KeyVaultName"]}.vault.azure.net/");
builder.Configuration.AddAzureKeyVault(keyVaultUri, new DefaultAzureCredential());

// Access secrets via IConfiguration
var connectionString = builder.Configuration["DatabaseConnectionString"];

// Direct access with SecretClient
builder.Services.AddSingleton(new SecretClient(keyVaultUri, new DefaultAzureCredential()));

public class SecretService
{
    private readonly SecretClient _secretClient;

    public SecretService(SecretClient secretClient)
    {
        _secretClient = secretClient;
    }

    public async Task<string> GetSecretAsync(string name)
    {
        var secret = await _secretClient.GetSecretAsync(name);
        return secret.Value.Value;
    }
}
```

## Azure Service Bus

```csharp
// Registration
builder.Services.AddSingleton(new ServiceBusClient(
    builder.Configuration.GetConnectionString("ServiceBus")));

// Publisher
public class OrderPublisher
{
    private readonly ServiceBusSender _sender;

    public OrderPublisher(ServiceBusClient client)
    {
        _sender = client.CreateSender("orders");
    }

    public async Task PublishOrderAsync(Order order)
    {
        var message = new ServiceBusMessage(JsonSerializer.SerializeToUtf8Bytes(order))
        {
            ContentType = "application/json",
            Subject = "OrderCreated",
            MessageId = order.Id.ToString()
        };

        await _sender.SendMessageAsync(message);
    }
}

// Consumer (background service)
public class OrderProcessor : BackgroundService
{
    private readonly ServiceBusProcessor _processor;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderProcessor> _logger;

    public OrderProcessor(
        ServiceBusClient client,
        IServiceProvider serviceProvider,
        ILogger<OrderProcessor> logger)
    {
        _processor = client.CreateProcessor("orders", new ServiceBusProcessorOptions
        {
            MaxConcurrentCalls = 5,
            AutoCompleteMessages = false
        });
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _processor.ProcessMessageAsync += ProcessMessageAsync;
        _processor.ProcessErrorAsync += ProcessErrorAsync;

        await _processor.StartProcessingAsync(stoppingToken);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task ProcessMessageAsync(ProcessMessageEventArgs args)
    {
        var order = JsonSerializer.Deserialize<Order>(args.Message.Body.ToString());

        using var scope = _serviceProvider.CreateScope();
        var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

        await orderService.ProcessAsync(order!);

        await args.CompleteMessageAsync(args.Message);
    }

    private Task ProcessErrorAsync(ProcessErrorEventArgs args)
    {
        _logger.LogError(args.Exception, "Error processing message");
        return Task.CompletedTask;
    }
}
```

## Application Insights

```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry();

// Custom telemetry
public class OrderService
{
    private readonly TelemetryClient _telemetry;
    private readonly ILogger<OrderService> _logger;

    public OrderService(TelemetryClient telemetry, ILogger<OrderService> logger)
    {
        _telemetry = telemetry;
        _logger = logger;
    }

    public async Task<Order> ProcessOrderAsync(Order order)
    {
        using var operation = _telemetry.StartOperation<RequestTelemetry>("ProcessOrder");

        try
        {
            // Process order...

            _telemetry.TrackEvent("OrderProcessed", new Dictionary<string, string>
            {
                ["OrderId"] = order.Id.ToString(),
                ["CustomerId"] = order.CustomerId,
                ["ItemCount"] = order.Items.Count.ToString()
            }, new Dictionary<string, double>
            {
                ["OrderTotal"] = (double)order.Total
            });

            return order;
        }
        catch (Exception ex)
        {
            _telemetry.TrackException(ex, new Dictionary<string, string>
            {
                ["OrderId"] = order.Id.ToString()
            });
            throw;
        }
    }
}

// Custom metrics
public class MetricsService
{
    private readonly TelemetryClient _telemetry;

    public MetricsService(TelemetryClient telemetry)
    {
        _telemetry = telemetry;
    }

    public void TrackOrderValue(decimal value)
    {
        _telemetry.GetMetric("OrderValue").TrackValue((double)value);
    }

    public void TrackApiLatency(string endpoint, TimeSpan duration)
    {
        _telemetry.GetMetric("ApiLatency", "Endpoint")
            .TrackValue(duration.TotalMilliseconds, endpoint);
    }
}
```

## Azure Blob Storage

```csharp
// Registration
builder.Services.AddSingleton(x =>
    new BlobServiceClient(builder.Configuration.GetConnectionString("BlobStorage")));

// Service
public class BlobStorageService
{
    private readonly BlobContainerClient _container;

    public BlobStorageService(BlobServiceClient client)
    {
        _container = client.GetBlobContainerClient("uploads");
    }

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType)
    {
        var blobName = $"{Guid.NewGuid()}/{fileName}";
        var blob = _container.GetBlobClient(blobName);

        await blob.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType });

        return blob.Uri.ToString();
    }

    public async Task<Stream> DownloadAsync(string blobName)
    {
        var blob = _container.GetBlobClient(blobName);
        var response = await blob.DownloadAsync();
        return response.Value.Content;
    }

    public async Task DeleteAsync(string blobName)
    {
        var blob = _container.GetBlobClient(blobName);
        await blob.DeleteIfExistsAsync();
    }

    public async Task<string> GetSasUrlAsync(string blobName, TimeSpan validity)
    {
        var blob = _container.GetBlobClient(blobName);

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _container.Name,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(validity)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        return blob.GenerateSasUri(sasBuilder).ToString();
    }
}
```

## Azure Cache for Redis

```csharp
// Registration
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis")!));

builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// Service
public class RedisCacheService : ICacheService
{
    private readonly IDatabase _database;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await _database.StringGetAsync(key);
        return value.HasValue ? JsonSerializer.Deserialize<T>(value!) : default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var json = JsonSerializer.Serialize(value);
        await _database.StringSetAsync(key, json, expiry);
    }

    public async Task RemoveAsync(string key)
    {
        await _database.KeyDeleteAsync(key);
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        var cached = await GetAsync<T>(key);
        if (cached is not null) return cached;

        var value = await factory();
        await SetAsync(key, value, expiry);
        return value;
    }
}
```
