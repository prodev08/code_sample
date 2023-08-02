<?php

namespace Api;

use \Input;
use \Response;
use Order\LineItem;
use \Order;
use Bestline\Order\Calculator;
use Bestline\ExpressionLanguage;
use \Bestline\Utils as BestlineUtils;
use \Log;
use Order\Transaction;
use Fabric\Type;
use \Order\LineItem as OrderLine;
use Order\LineItem\Option as LineItemOption;
use \Product;
use \RingType;
use \Company;
use \DB;
use \ShippingMethod;
use \Lookups\Hardware;
use \Lookups\PullType;
use \Lookups\CordPosition;
use \Lookups\Mount;
use \Lookups\ValanceType;
use \Exception;

class OrderController extends BaseController
{
    public function getDefaultOptions($orderId)
    {
        $order = Order::find($orderId);

        if(!$order instanceof Order) {
            return \Response::json("Invalid Order ID", 500);
        }

        $defaultOptions = $order->defaultOptions;

        $retval = [];

        foreach($defaultOptions as $defaultOption) {

            $ret = $defaultOption->option->toArray();

            $subOption = $defaultOption->subOption;

            if(!$subOption instanceof \Option) {
                continue;
            }

            $ret['subOption'] = $subOption->toArray();

            $retval[] = $ret;
        }

        return \Response::json($retval);
    }

    public function getCalculate($orderId)
    {
        $jsonData = Input::get('data', null);

        if(is_null($jsonData)) {
            return Response::json('Bad input', 500);
        }

        $input = json_decode($jsonData, true);

        if(is_null($input)) {
            return Response::json('Malformed input', 500);
        }

        $lineItem = LineItem::getLineItemFromInputs($input);

        $hasOptions = isset($input['options']);
        if($hasOptions){
            $lineOptions = [];
            foreach($input['options'] as $lineOption){
                $lineOptions[] = LineItemOption::getFromInputs($lineOption);
            }
            $lineItem->options = $lineOptions;
        }

        $result = [];
        $result['shade'] = number_format(Calculator::calculateShadePrice($lineItem), 2, '.', '');
        $result['fabric'] = number_format(Calculator::calculateFabricPrice($lineItem), 2, '.', '');
        $result['options'] = number_format(Calculator::calculateOptionPrice($lineItem), 2, '.', '');

        return Response::json($result);
    }

    public function getIndex($orderId)
    {
        $order = Order::with(
            'alerts',
            'orderLines',
            'orderLines.options',
            'orderLines.options.data',
            'orderLines.options.option',
            'orderLines.options.subOption',
            'defaultOptions',
            'defaultOptions.data',
            'defaultOptions.option',
            'defaultOptions.subOption',
            'fabrics',
            'fabrics.type',
            'fabrics.fabric',
            'fabrics.options',
            'fabrics.options.data',
            'fabrics.options.option',
            'fabrics.options.subOption',
			'billingAddress',
			'customerType',
			'shippingMethod',
			'company',
			'shippingAddress',
            'product',
            'contact',
            'ringType',
            'finalized'
		)->find($orderId);

        if(!$order instanceof Order) {
            Log::error("Failed to locate order with ID {$orderId}");
            return Response::json("Order not found", 404);
        }

        $order->company->credit_terms_description = $order->company->getCreditTermsDesc($order->company->credit_terms);

        if($order->contact){
            $order->contact->phone_number = $order->contact->phone_number;
            $order->contact->email = $order->contact->email;
            $order->contact->full_name = $order->contact->full_name;
        }
        return Response::json($order);
    }

    public function putIndex($orderId)
    {
        $inputs = Input::get('data', '{}');

        try {
            $order = Order::createFromOrderData($inputs);

            $order->save();

            foreach($order->orderLinesUnsaved as $orderLine){

                $orderLine->order_id = $order->id;
                $orderLine->save();

                foreach($orderLine->optionsUnsaved as $option){
                    $option->order_line_id = $orderLine->id;
                    $option->save();

                    if($option->dataUnsaved){

                        $option->dataUnsaved->order_line_option_id = $option->id;
                        $option->dataUnsaved->save();
                    }
                }
            }

            $order->reviewOrderForAlerts();
            $order->calculateTotals();
            $order->save();
        } catch(\Exception $e) {
            return Response::json(array('success' => false, 'message' => $e->getMessage(), 'trace' => $e->getTrace()), 422);
        }

        return Response::json(array('success' => true));
    }

    public function storeStep1()
    {
        $input = Input::get('data', '{}');

        try {
            $order = Order::getFromInputsStep1($input);
            DB::transaction(function() use ($order) {
                $order->save();

                foreach($order->fabricsUnsaved as $fabric){
                    $fabric->order_id = $order->id;
                    $fabric->save();

                    foreach($fabric->optionsUnsaved as $fabricOption){
                        $fabricOption->order_fabric_id = $fabric->id;
                        $fabricOption->order_id = $order->id;
                        $fabricOption->save();

                        if($fabricOption->dataUnsaved){

                            $fabricOption->dataUnsaved->order_fabric_option_id = $fabricOption->id;
                            $fabricOption->dataUnsaved->save();
                        }
                    }
                }
                foreach($order->optionsUnsaved as $option){
                    $option->order_id = $order->id;
                    $option->save();

                    if($option->option->is_embellishment_option || $option->sub_option->is_embellishment_option){
                        throw new Exception("Make sure all embellishment options are added to fabrics.");
                    }

                    if($option->dataUnsaved){

                        $option->dataUnsaved->order_option_id = $option->id;
                        $option->dataUnsaved->save();
                    }
                }

            });
        } catch(Exception $e) {
            return Response::json(array('success' => false, 'message' => $e->getMessage(), 'trace' => $e->getTrace()), 422);
        }

        $order->load('fabrics');
        $order->load('defaultOptions');

        return Response::json($order->toArray());
    }

    //return an object with all the select options available to companies
    public function selectOptions(){

        $options = new \stdClass();

        $options->companies = Company::orderBy('name', 'asc')->get(['id', 'name'])->toArray();
        $options->products = Product::orderBy('name', 'asc')->get(['id', 'name', 'ring_type_id'])->toArray();
        $options->ring_types = RingType::orderBy('description', 'asc')->get(['id', 'description'])->toArray();
        $options->shipping_methods = ShippingMethod::orderBy('name', 'asc')->get(['id', 'name'])->toArray();
        $options->hardware = Hardware::orderBy('description', 'asc')->get(['id', 'description', 'related_option_id'])->toArray();
        $options->height_adjustment = OrderLine::$heightAdjustmentOptions;
        $options->cord_positions = CordPosition::orderBy('description', 'asc')->get(['id', 'description'])->toArray();
        $options->mounts = Mount::orderBy('description', 'asc')->get(['id', 'description'])->toArray();
        $options->pull_types = PullType::all()->load('hardware')->toArray();
        $options->valance_types = ValanceType::orderBy('name', 'asc')->get(['id', 'name', 'type'])->toArray();

        return Response::json($options);
    }

    public function getTransactionsDatatable($orderId)
    {
        $logs = Transaction::with('user')->where('order_id', '=', $orderId)
                                         ->orderBy('created_at', 'desc');

        return \Datatable::query($logs)
                         ->showColumns('created_at', 'user_full_name', 'message')
                         ->searchColumns('message')
                         ->orderColumns('created_at')
                         ->make();
    }

    public function getAllOpen()
    {
        $openOrders = Order::with(
            'orderLines',
            'fabrics',
            'fabrics.type',
            'fabrics.fabric',
            'shippingMethod',
            'company',
            'product',
            'contact',
            'finalized',
            'alerts'
        )->orderBy('id', 'desc')->get();

        foreach($openOrders as $order){
            $order->in_confirmation_timeframe = $order->in_confirmation_timeframe;
            $order->is_ship = $order->is_ship;
            $order->is_finalized = $order->is_finalized;
            foreach($order->fabrics as $fabric){
                $fabric->fabric->name = $fabric->fabric->name;
            }
        }

        return Response::json($openOrders->toArray());
    }

    public function destroy($order_id)
    {
        $order = Order::find($order_id);
        $order->delete();

        Response::json(array('success' => array('message' => 'Order #'. $order_id .' was deleted')));
    }

    public function finalize($orderId){

        $order = Order::find($orderId);

        if(!$order instanceof Order) {
            return Response::json(array('error' => array('message' => 'Could not find this order. Refresh the page and try again.')), 422);
        }

        if (count($order->orderLines) < 1) {
            return Response::json(array('error' => array('message' => 'You cannot finalize an order with no items')), 422);
        }

        try {
           $order->finalize();
        } catch(Exception $e) {
            return Response::json(array('error' => array('message' => $e->getMessage(), 'trace' => $e->getTrace())), 422);
        }

        $orderReFeched = Order::with( //hack needed because finalized was still null for some reason
            'finalized'
        )->find($orderId);

        return Response::json($orderReFeched->toArray());
    }
}