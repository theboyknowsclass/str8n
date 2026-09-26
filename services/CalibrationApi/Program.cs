using CalibrationApi.Models;
using CalibrationApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<CalibrationStore>();
builder.Services.AddSingleton<CalibrationTrainer>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/api/calibration/status", (CalibrationStore store) => new { recordCount = store.Count })
    .WithName("GetCalibrationStatus");

app.MapPost(
    "/api/calibration/samples",
    (List<CalibrationSampleRecord> records, CalibrationStore store) =>
    {
        if (records.Count == 0)
        {
            return Results.BadRequest("No records provided.");
        }

        store.Append(records);
        return Results.Ok(new { recordCount = store.Count });
    }
)
    .WithName("UploadCalibrationSamples");

app.MapPost(
    "/api/calibration/train",
    (CalibrationStore store, CalibrationTrainer trainer) =>
    {
        var records = store.GetAll();
        if (records.Count == 0)
        {
            return Results.BadRequest("No calibration records on file - upload samples first.");
        }

        try
        {
            var result = trainer.TrainAndRecommend(records);
            return Results.Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ex.Message);
        }
    }
)
    .WithName("TrainCalibrationModel");

app.Run();
