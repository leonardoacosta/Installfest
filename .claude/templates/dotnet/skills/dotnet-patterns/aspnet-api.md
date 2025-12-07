# ASP.NET Core API Patterns

## Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all products with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null)
    {
        var products = await _productService.GetProductsAsync(page, pageSize, category);
        return Ok(products);
    }

    /// <summary>
    /// Gets a product by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _productService.GetByIdAsync(id);

        if (product is null)
        {
            return NotFound();
        }

        return Ok(product);
    }

    /// <summary>
    /// Creates a new product
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
    {
        var product = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    /// <summary>
    /// Updates an existing product
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
    {
        var success = await _productService.UpdateAsync(id, request);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>
    /// Deletes a product
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var success = await _productService.DeleteAsync(id);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
```

## Minimal API Pattern

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IProductService, ProductService>();

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Map endpoints
app.MapProductEndpoints();

app.Run();

// ProductEndpoints.cs
public static class ProductEndpoints
{
    public static void MapProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/products")
            .WithTags("Products")
            .WithOpenApi();

        group.MapGet("/", GetProducts)
            .WithName("GetProducts");

        group.MapGet("/{id:int}", GetProduct)
            .WithName("GetProduct");

        group.MapPost("/", CreateProduct)
            .WithName("CreateProduct");

        group.MapPut("/{id:int}", UpdateProduct)
            .WithName("UpdateProduct");

        group.MapDelete("/{id:int}", DeleteProduct)
            .WithName("DeleteProduct");
    }

    private static async Task<IResult> GetProducts(
        IProductService productService,
        int page = 1,
        int pageSize = 10)
    {
        var products = await productService.GetProductsAsync(page, pageSize);
        return Results.Ok(products);
    }

    private static async Task<IResult> GetProduct(int id, IProductService productService)
    {
        var product = await productService.GetByIdAsync(id);
        return product is null ? Results.NotFound() : Results.Ok(product);
    }

    private static async Task<IResult> CreateProduct(
        CreateProductRequest request,
        IProductService productService)
    {
        var product = await productService.CreateAsync(request);
        return Results.CreatedAtRoute("GetProduct", new { id = product.Id }, product);
    }

    private static async Task<IResult> UpdateProduct(
        int id,
        UpdateProductRequest request,
        IProductService productService)
    {
        var success = await productService.UpdateAsync(id, request);
        return success ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> DeleteProduct(int id, IProductService productService)
    {
        var success = await productService.DeleteAsync(id);
        return success ? Results.NoContent() : Results.NotFound();
    }
}
```

## Global Exception Handler

```csharp
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception occurred");

        var problemDetails = exception switch
        {
            NotFoundException => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = exception.Message
            },
            ValidationException validationEx => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = string.Join(", ", validationEx.Errors)
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred"
            }
        };

        httpContext.Response.StatusCode = problemDetails.Status ?? 500;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}

// Register in Program.cs
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Use in pipeline
app.UseExceptionHandler();
```

## Authentication/Authorization

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["AzureAd:Authority"];
        options.Audience = builder.Configuration["AzureAd:Audience"];
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("CanEditProducts", policy =>
        policy.RequireClaim("permission", "products:write"));
});

// Controller usage
[Authorize]
[HttpGet("me")]
public ActionResult<UserDto> GetCurrentUser()
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    // ...
}

[Authorize(Policy = "AdminOnly")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUser(int id)
{
    // ...
}
```
