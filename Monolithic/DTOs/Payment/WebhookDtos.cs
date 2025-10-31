public class WebhookPayload
{
    public string code { get; set; }
    public string desc { get; set; }
    public bool success { get; set; }
    public WebhookData data { get; set; }
    public string signature { get; set; }
}

public class WebhookData
{
    public long orderCode { get; set; }
    public decimal amount { get; set; }
    public string description { get; set; }
    public string accountNumber { get; set; }
    public string reference { get; set; }
    public string transactionDateTime { get; set; }
    public string paymentLinkId { get; set; }
    public string? counterAccountBankId { get; set; }
    public string? counterAccountBankName { get; set; }
    public string? counterAccountName { get; set; }
    public string? counterAccountNumber { get; set; }
    public string? virtualAccountName { get; set; }
    public string virtualAccountNumber { get; set; }
}

public class WebhookType
{
    public string code { get; set; }
    public string desc { get; set; }
    public bool success { get; set; }
    public WebhookData data { get; set; }
    public string signature { get; set; }
}
