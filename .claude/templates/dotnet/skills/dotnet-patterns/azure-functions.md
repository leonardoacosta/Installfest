# Azure Functions Patterns

## Isolated Process Setup (.NET 8+)

```csharp
// Program.cs
var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices((context, services) =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        // Add your services
        services.AddScoped<IOrderService, OrderService>();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(context.Configuration.GetConnectionString("Default")));
    })
    .Build();

host.Run();
```

## HTTP Trigger

```csharp
public class ProductFunctions
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductFunctions> _logger;

    public ProductFunctions(IProductService productService, ILogger<ProductFunctions> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [Function("GetProducts")]
    public async Task<HttpResponseData> GetProducts(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products")] HttpRequestData req)
    {
        _logger.LogInformation("Getting all products");

        var products = await _productService.GetAllAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(products);
        return response;
    }

    [Function("GetProduct")]
    public async Task<HttpResponseData> GetProduct(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products/{id:int}")] HttpRequestData req,
        int id)
    {
        var product = await _productService.GetByIdAsync(id);

        if (product is null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(product);
        return response;
    }
}
```

## Service Bus Trigger

```csharp
public class OrderProcessor
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrderProcessor> _logger;

    public OrderProcessor(IOrderService orderService, ILogger<OrderProcessor> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    [Function("ProcessOrder")]
    public async Task ProcessOrder(
        [ServiceBusTrigger("orders", Connection = "ServiceBusConnection")] OrderMessage message,
        FunctionContext context)
    {
        _logger.LogInformation("Processing order {OrderId}", message.OrderId);

        try
        {
            await _orderService.ProcessAsync(message);
            _logger.LogInformation("Order {OrderId} processed successfully", message.OrderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process order {OrderId}", message.OrderId);
            throw; // Let the function retry
        }
    }
}

public record OrderMessage(Guid OrderId, string CustomerId, decimal Total);
```

## Timer Trigger

```csharp
public class CleanupFunctions
{
    private readonly ICleanupService _cleanupService;
    private readonly ILogger<CleanupFunctions> _logger;

    public CleanupFunctions(ICleanupService cleanupService, ILogger<CleanupFunctions> logger)
    {
        _cleanupService = cleanupService;
        _logger = logger;
    }

    // Runs every day at midnight
    [Function("DailyCleanup")]
    public async Task DailyCleanup(
        [TimerTrigger("0 0 0 * * *")] TimerInfo timer,
        FunctionContext context)
    {
        _logger.LogInformation("Daily cleanup started at {Time}", DateTime.UtcNow);

        var deletedCount = await _cleanupService.CleanupOldRecordsAsync();

        _logger.LogInformation("Deleted {Count} old records", deletedCount);
    }
}
```

## Blob Trigger

```csharp
public class BlobFunctions
{
    private readonly IImageProcessor _imageProcessor;
    private readonly ILogger<BlobFunctions> _logger;

    public BlobFunctions(IImageProcessor imageProcessor, ILogger<BlobFunctions> logger)
    {
        _imageProcessor = imageProcessor;
        _logger = logger;
    }

    [Function("ProcessImage")]
    [BlobOutput("processed/{name}", Connection = "StorageConnection")]
    public async Task<byte[]> ProcessImage(
        [BlobTrigger("uploads/{name}", Connection = "StorageConnection")] byte[] imageData,
        string name,
        FunctionContext context)
    {
        _logger.LogInformation("Processing image: {Name}", name);

        var processedImage = await _imageProcessor.ResizeAsync(imageData, 800, 600);

        return processedImage;
    }
}
```

## Durable Functions

```csharp
public class OrderOrchestrator
{
    [Function("OrderOrchestrator")]
    public static async Task<OrderResult> RunOrchestrator(
        [OrchestrationTrigger] TaskOrchestrationContext context)
    {
        var order = context.GetInput<Order>();

        // Validate order
        var isValid = await context.CallActivityAsync<bool>("ValidateOrder", order);
        if (!isValid)
        {
            return new OrderResult { Success = false, Message = "Invalid order" };
        }

        // Process payment
        var paymentResult = await context.CallActivityAsync<PaymentResult>("ProcessPayment", order);
        if (!paymentResult.Success)
        {
            return new OrderResult { Success = false, Message = "Payment failed" };
        }

        // Fulfill order
        await context.CallActivityAsync("FulfillOrder", order);

        // Send notification
        await context.CallActivityAsync("SendConfirmation", order);

        return new OrderResult { Success = true, OrderId = order.Id };
    }

    [Function("ValidateOrder")]
    public static Task<bool> ValidateOrder([ActivityTrigger] Order order)
    {
        // Validation logic
        return Task.FromResult(order.Items.Any());
    }

    [Function("ProcessPayment")]
    public static async Task<PaymentResult> ProcessPayment(
        [ActivityTrigger] Order order,
        FunctionContext context)
    {
        var paymentService = context.InstanceServices.GetRequiredService<IPaymentService>();
        return await paymentService.ChargeAsync(order);
    }
}
```

## local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "ServiceBusConnection": "Endpoint=sb://...",
    "StorageConnection": "DefaultEndpointsProtocol=https;..."
  },
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=MyDb;..."
  }
}
```
