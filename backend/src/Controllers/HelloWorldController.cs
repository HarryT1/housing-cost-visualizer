using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class HelloWorldController : ControllerBase
{

    private readonly ILogger<HelloWorldController> _logger;

    public HelloWorldController(ILogger<HelloWorldController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetHelloWorld")]
    public IActionResult Get()
    {
        var data = new
        {
            message = "Hello world!"
        };

        return Ok(data);
    }
}
