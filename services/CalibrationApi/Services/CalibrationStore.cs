using System.Text.Json;
using CalibrationApi.Models;

namespace CalibrationApi.Services;

/// <summary>
/// Persists uploaded calibration records to a single local JSON file.
/// This is a dev-only tool with modest data volume (one developer's
/// calibration sweeps, not production user telemetry) - a real database
/// would be solving a problem this doesn't have yet. Swap for something
/// heavier if this ever grows into a live, multi-user feedback loop.
/// </summary>
public class CalibrationStore
{
    private readonly string _filePath;
    private readonly object _lock = new();
    private List<CalibrationSampleRecord> _records;

    public CalibrationStore(IConfiguration configuration)
    {
        _filePath = configuration["CalibrationDataPath"] ?? "calibration-data.json";
        _records = LoadFromDisk();
    }

    public int Count
    {
        get
        {
            lock (_lock)
            {
                return _records.Count;
            }
        }
    }

    public void Append(IEnumerable<CalibrationSampleRecord> newRecords)
    {
        lock (_lock)
        {
            _records.AddRange(newRecords);
            SaveToDisk();
        }
    }

    public List<CalibrationSampleRecord> GetAll()
    {
        lock (_lock)
        {
            return [.. _records];
        }
    }

    private List<CalibrationSampleRecord> LoadFromDisk()
    {
        if (!File.Exists(_filePath))
        {
            return [];
        }

        var json = File.ReadAllText(_filePath);
        return JsonSerializer.Deserialize<List<CalibrationSampleRecord>>(json) ?? [];
    }

    private void SaveToDisk()
    {
        var json = JsonSerializer.Serialize(_records);
        File.WriteAllText(_filePath, json);
    }
}
